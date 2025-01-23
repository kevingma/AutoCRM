<script lang="ts">
  import { Auth } from "@supabase/auth-ui-svelte"
  import { sharedAppearance, oauthProviders } from "../login_config"
  import { goto } from "$app/navigation"
  import { onMount } from "svelte"

  let { data } = $props()
  let { supabase } = data

  onMount(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event == "SIGNED_IN") {
        setTimeout(() => {
          goto("/account")
        }, 1)
      }
    })
  })
</script>

<svelte:head>
  <title>Sign In</title>
</svelte:head>

<h1 class="text-2xl font-bold mb-6">Sign In to AutoCRM</h1>
<Auth
  supabaseClient={data.supabase}
  view="sign_in"
  redirectTo={`${data.url}/auth/callback`}
  providers={oauthProviders}
  socialLayout="horizontal"
  showLinks={false}
  appearance={sharedAppearance}
  additionalData={undefined}
/>
<div class="text-l text-slate-800 mt-4">
  <a class="underline" href="/login/forgot_password">Forgot password?</a>
</div>
<div class="text-l text-slate-800 mt-3">
  Don’t have an account? <a class="underline" href="/login/sign_up">Sign up</a>.
</div>
