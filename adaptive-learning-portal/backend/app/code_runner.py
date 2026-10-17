import sys
import os
import ast
import json
import time
import textwrap
import tempfile
import subprocess
from typing import List, Dict, Any, Tuple

NETWORK_MODULES = {
    "socket", "requests", "urllib", "http", "urllib3", "aiohttp",
    "ftplib", "smtplib", "telnetlib", "ssl", "httpx"
}

FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "ctypes", "shutil", "builtins",
    "pty", "signal", "multiprocessing", "threading", "pickle"
}.union(NETWORK_MODULES)

FORBIDDEN_CALLS = {
    "open", "eval", "exec", "__import__", "compile", "globals", "locals"
}

def analyze_ast_safety(code: str) -> Tuple[bool, str, str]:
    """Inspects code syntax and AST nodes to reject destructive operations before execution."""
    cleaned_code = textwrap.dedent(code).strip()
    try:
        tree = ast.parse(cleaned_code)
    except SyntaxError as e:
        return False, f"Syntax Error: {e.msg} at line {e.lineno}", "syntax_error"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod = alias.name.split('.')[0]
                if mod in NETWORK_MODULES:
                    return False, f"Restricted Sandbox: Network access module '{mod}' is strictly blocked. Outbound socket calls are disabled.", "network_attempt"
                elif mod in FORBIDDEN_MODULES:
                    return False, f"Restricted Sandbox: Module '{mod}' is forbidden. System shell and file manipulation blocked.", "sandbox_escape"
        elif isinstance(node, ast.ImportFrom):
            mod = (node.module or '').split('.')[0]
            if mod in NETWORK_MODULES:
                return False, f"Restricted Sandbox: Network access module '{mod}' is strictly blocked. Outbound socket calls are disabled.", "network_attempt"
            elif mod in FORBIDDEN_MODULES:
                return False, f"Restricted Sandbox: Module '{mod}' is forbidden. System shell and file manipulation blocked.", "sandbox_escape"
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                return False, f"Restricted Sandbox: Calling internal function '{node.func.id}' is blocked by sandbox policy.", "restricted_call"

    return True, "", ""

def run_isolated_code_test(
    code: str, function_name: str, test_cases: List[Dict[str, Any]], timeout_seconds: float = 3.0
) -> Dict[str, Any]:
    """
    Executes student code strictly inside an isolated subprocess with timeout and stdout capture.
    Never executes untrusted code inside the main API process.
    """
    cleaned_code = textwrap.dedent(code).strip()
    is_safe, error_msg, violation_type = analyze_ast_safety(cleaned_code)
    if not is_safe:
        return {
            "status": "Security Error",
            "violation_type": violation_type,
            "error_msg": error_msg,
            "tests_passed": 0,
            "total_tests": len(test_cases),
            "runtime_ms": 0.0,
            "results": [
                {
                    "test_id": i + 1,
                    "is_hidden": tc.get("is_hidden", False),
                    "passed": False,
                    "error": error_msg
                } for i, tc in enumerate(test_cases)
            ],
            "execution_mode": "Isolated Sandboxed Subprocess (AST Pre-screened)"
        }

    encoded_test_cases = json.dumps(test_cases)
    
    # Generate a robust test runner script that deserializes test cases properly
    harness_code = f"""import sys
import json
import time

{cleaned_code}

raw_tests = {json.dumps(encoded_test_cases)}
test_cases = json.loads(raw_tests)
func_target = locals().get("{function_name}")
results = []

if not func_target or not callable(func_target):
    print(json.dumps({{"error": "Function '{function_name}' was not found or is not callable in submitted code."}}))
    sys.exit(0)

for idx, tc in enumerate(test_cases):
    inp_val = tc.get("input")
    expected_val = tc.get("expected")
    is_hidden = tc.get("is_hidden", False)
    
    start_t = time.perf_counter()
    try:
        if isinstance(inp_val, list) and tc.get("unpack_args", False):
            actual_val = func_target(*inp_val)
        elif isinstance(inp_val, dict) and tc.get("is_kwargs", False):
            actual_val = func_target(**inp_val)
        else:
            actual_val = func_target(inp_val)
            
        elapsed = (time.perf_counter() - start_t) * 1000
        
        passed = (actual_val == expected_val)
        results.append({{
            "test_id": idx + 1,
            "is_hidden": is_hidden,
            "passed": bool(passed),
            "actual_repr": str(actual_val) if not is_hidden else "[Masked Hidden Test Output]",
            "input_repr": str(inp_val) if not is_hidden else "[Masked Hidden Input]",
            "expected_repr": str(expected_val) if not is_hidden else "[Masked Expected Output]",
            "runtime_ms": round(elapsed, 2),
            "error": None
        }})
    except Exception as exc:
        results.append({{
            "test_id": idx + 1,
            "is_hidden": is_hidden,
            "passed": False,
            "actual_repr": None,
            "input_repr": str(inp_val) if not is_hidden else "[Masked Hidden Input]",
            "expected_repr": str(expected_val) if not is_hidden else "[Masked Expected Output]",
            "runtime_ms": 0.0,
            "error": f"{{type(exc).__name__}}: {{str(exc)}}"
        }})

print(json.dumps({{"results": results}}))
"""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as temp_file:
        temp_file.write(harness_code)
        temp_file_path = temp_file.name

    start_global = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, temp_file_path],
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        total_time_ms = (time.perf_counter() - start_global) * 1000
        
        if proc.returncode != 0:
            err_line = proc.stderr.strip() or "Process exited with non-zero code."
            return {
                "status": "Error",
                "tests_passed": 0,
                "total_tests": len(test_cases),
                "runtime_ms": round(total_time_ms, 2),
                "results": [
                    {
                        "test_id": i + 1,
                        "is_hidden": tc.get("is_hidden", False),
                        "passed": False,
                        "error": err_line
                    } for i, tc in enumerate(test_cases)
                ],
                "execution_mode": "Isolated Sandboxed Subprocess"
            }

        out_raw = proc.stdout.strip()
        data = json.loads(out_raw) if out_raw else {}
        if "error" in data:
            return {
                "status": "Error",
                "tests_passed": 0,
                "total_tests": len(test_cases),
                "runtime_ms": round(total_time_ms, 2),
                "results": [{"test_id": 1, "is_hidden": False, "passed": False, "error": data["error"]}],
                "execution_mode": "Isolated Sandboxed Subprocess"
            }

        results = data.get("results", [])
        passed_count = sum(1 for r in results if r.get("passed"))
        all_passed = (passed_count == len(test_cases))

        return {
            "status": "Accepted" if all_passed else "Failed",
            "tests_passed": passed_count,
            "total_tests": len(test_cases),
            "runtime_ms": round(total_time_ms, 2),
            "results": results,
            "execution_mode": "Isolated Sandboxed Subprocess (Safe Execution)"
        }

    except subprocess.TimeoutExpired:
        timeout_msg = f"Execution exceeded {timeout_seconds}s time limit (infinite loop or resource exhaustion contained)."
        return {
            "status": "Timed Out",
            "violation_type": "infinite_loop_timeout",
            "error_msg": timeout_msg,
            "tests_passed": 0,
            "total_tests": len(test_cases),
            "runtime_ms": timeout_seconds * 1000,
            "results": [{"test_id": 1, "is_hidden": False, "passed": False, "error": timeout_msg}],
            "execution_mode": "Isolated Sandboxed Subprocess (SIGKILL Terminated)"
        }
    except Exception as ex:
        return {
            "status": "Execution Error",
            "tests_passed": 0,
            "total_tests": len(test_cases),
            "runtime_ms": 0.0,
            "results": [{"test_id": 1, "is_hidden": False, "passed": False, "error": str(ex)}],
            "execution_mode": "Isolated Sandboxed Subprocess"
        }
    finally:
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception:
            pass
