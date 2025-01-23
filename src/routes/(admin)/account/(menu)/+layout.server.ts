import { redirect } from "@sveltejs/kit"
import type { LayoutServerLoad } from "./$types"

/**
 * This load function runs for all pages in `(admin)/account/(menu)`,
 * making the `userRole` available in `$page.data.userRole`.
 */
export const load: LayoutServerLoad = async ({
  locals: { supabase, safeGetSession },
}) => {
  const { session, user } = await safeGetSession()
  if (!session || !user) {
    throw redirect(303, "/login")
  }

  // Fetch user profile to determine role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    // If any error, fallback to an empty role
    return { userRole: "" }
  }

  return {
    userRole: profile.role,
  }
}
