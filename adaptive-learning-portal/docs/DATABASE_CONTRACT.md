\# Database Contract — Adaptive Learning and Assessment Portal



\## 1. Purpose



This document is the shared database contract between the frontend, FastAPI backend, adaptive-learning engine, assessment system, and trainer dashboard.



The Supabase database is the central persistence layer.



The backend owns business logic and database writes that affect learning decisions.



The frontend must not contain or use the Supabase service-role key.



\---



\## 2. Supabase Project



Project ref:



`uqkkohqascqralvetmxc`



Supabase region:



`Tokyo`



The frontend/backend environment should obtain the Supabase URL and public/anon key from the Supabase project settings.



Do NOT commit:



\- `SUPABASE\_SERVICE\_ROLE\_KEY`

\- database password

\- LLM API keys

\- sandbox credentials

\- private tokens



Only public/anon credentials may be used where appropriate.



\---



\## 3. Architecture



```text

Student / Trainer

&#x20;      |

&#x20;      v

React Frontend

&#x20;      |

&#x20;      v

FastAPI Backend

&#x20;      |

&#x20;      +--------------------+

&#x20;      |                    |

&#x20;      v                    v

&#x20;  Supabase            Secure Sandbox

&#x20;      |                    |

&#x20;      |                    v

&#x20;      |              Code execution

&#x20;      |

&#x20;      +--------------------+

&#x20;      |

&#x20;      v

Adaptive / Knowledge Tracing Engine

&#x20;      |

&#x20;      v

Recommendation + Mastery Update

