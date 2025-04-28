
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { MembershipPlanForm } from '../_components/membership-form'

export default async function MembershipCreatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create Membership</h1>
      </div>
      <MembershipPlanForm />
    </div>
  )
}