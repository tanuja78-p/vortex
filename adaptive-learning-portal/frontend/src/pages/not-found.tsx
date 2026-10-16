import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/states'

export function NotFoundPage() {
  return (
    <Card className="my-12">
      <EmptyState
        icon={<Compass className="size-6 text-primary" aria-hidden />}
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Back to dashboard
          </Link>
        }
      />
    </Card>
  )
}
