<script lang="ts">
  import {
    WebsiteName,
    WebsiteBaseUrl,
    WebsiteDescription,
  } from "./../../config"

  // Updated brand name and marketing details
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AutoCRM",
    url: WebsiteBaseUrl,
  }
  const jsonldScript = `<script type="application/ld+json">${
    JSON.stringify(ldJson) + "<"
  }/script>`

  // Example features we want to show for an AI-powered CRM
  const features = [
    {
      name: "AI Ticket Resolution",
      description:
        "Leverage generative AI to automatically draft and resolve common support tickets. Free up your support team’s time for more complex interactions.",
      link: "/account", // or any route you'd like
      linkText: "Try It",
      newPage: false,
      svgContent: `<path d="M4.01207 15.7618L5.70156 10.6933C6.46758 8.39525 6.85059 7.24623 7.75684 7.03229C8.6631 6.81835 9.51953 7.67478 11.2324 9.38764L14.6114 12.7666C16.3242 14.4795 17.1807 15.3359 16.9667 16.2422C16.7528 17.1484 15.6038 17.5314 13.3057 18.2975L8.23724 19.987C5.47183 20.9088 4.08912 21.3697 3.35924 20.6398C2.62936 19.9099 3.09026 18.5272 4.01207 15.7618Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M12.2351 18.3461C12.2351 18.3461 11.477 16.0649 11.477 14.5552C11.477 13.0454 12.2351 10.7643 12.2351 10.7643M8.06517 19.4833C8.06517 19.4833 7.42484 16.7314 7.307 14.9343C7.11229 11.965 8.06517 7.35254 8.06517 7.35254" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M14.5093 10.0061L14.6533 9.28614C14.7986 8.55924 15.3224 7.96597 16.0256 7.73155C16.7289 7.49714 17.2526 6.90387 17.398 6.17697L17.542 5.45703" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M17.5688 12.2533L17.7817 12.3762C18.4388 12.7556 19.265 12.6719 19.8327 12.1685C20.3468 11.7126 21.0789 11.597 21.7085 11.8723L22 11.9997" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M10.5352 3C10.1977 3.55206 10.2823 4.26344 10.7399 4.72097L10.8377 4.81885C11.2309 5.21201 11.3759 5.78959 11.215 6.32182" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M13.561 4.39648C13.7621 4.19542 13.8626 4.09489 13.9788 4.05804C14.0772 4.02688 14.1827 4.02688 14.281 4.05804C14.3973 4.09489 14.4978 4.19542 14.6989 4.39648C14.8999 4.59753 15.0004 4.69806 15.0373 4.8143C15.0685 4.91262 15.0685 5.01817 15.0373 5.11648C15.0004 5.23272 14.8999 5.33325 14.6989 5.53431C14.4978 5.73536 14.3973 5.83589 14.281 5.87274C14.1827 5.90391 14.0772 5.90391 13.9788 5.87274C13.8626 5.83589 13.7621 5.73536 13.561 5.53431C13.36 5.33325 13.2594 5.23272 13.2226 5.11648C13.1914 5.01817 13.1914 4.91262 13.2226 4.8143C13.2594 4.69806 13.36 4.59753 13.561 4.39648Z" fill="#1C274C"/>
<path d="M19.4682 7.46822C19.7136 7.22283 19.8363 7.10014 19.9747 7.04681C20.1367 6.9844 20.3161 6.9844 20.4781 7.04681C20.6165 7.10014 20.7392 7.22283 20.9846 7.46822C21.23 7.71362 21.3527 7.83631 21.406 7.97472C21.4684 8.1367 21.4684 8.31609 21.406 8.47807C21.3527 8.61649 21.23 8.73918 20.9846 8.98457C20.7392 9.22996 20.6165 9.35266 20.4781 9.40599C20.3161 9.4684 20.1367 9.4684 19.9747 9.40599C19.8363 9.35266 19.7136 9.22996 19.4682 8.98457C19.2228 8.73918 19.1001 8.61649 19.0468 8.47807C18.9844 8.31609 18.9844 8.1367 19.0468 7.97472C19.1001 7.83631 19.2228 7.71362 19.4682 7.46822Z" fill="#1C274C"/>
<path d="M6.92712 3.94079C7.13659 3.73132 7.47621 3.73132 7.68567 3.94079C7.89514 4.15026 7.89514 4.48988 7.68567 4.69935C7.47621 4.90882 7.13659 4.90882 6.92712 4.69935C6.71765 4.48988 6.71765 4.15026 6.92712 3.94079Z" fill="#1C274C"/>
<path d="M19.058 15.3134C19.2674 15.1039 19.6071 15.1039 19.8165 15.3134C20.026 15.5228 20.026 15.8624 19.8165 16.0719C19.6071 16.2814 19.2674 16.2814 19.058 16.0719C18.8485 15.8624 18.8485 15.5228 19.058 15.3134Z" fill="#1C274C"/>
<path d="M17.5 9.74145C17.7095 9.53198 18.0491 9.53198 18.2586 9.74145C18.468 9.95092 18.468 10.2905 18.2586 10.5C18.0491 10.7095 17.7095 10.7095 17.5 10.5C17.2905 10.2905 17.2905 9.95092 17.5 9.74145Z" fill="#1C274C"/>`,
    },
    {
      name: "Custom Workflows",
      description:
        "Automate repetitive tasks and personalize ticket handling with adjustable flows tailored to your organization’s needs.",
      link: "/account",
      linkText: "Learn More",
      newPage: false,
      svgContent: `<path d="M2.26121 3.09184L2.50997 2.38429H2.50997L2.26121 3.09184ZM2.24876 2.29246C1.85799 2.15507 1.42984 2.36048 1.29246 2.75124C1.15507 3.14201 1.36048 3.57016 1.75124 3.70754L2.24876 2.29246ZM4.58584 4.32298L5.20507 3.89983V3.89983L4.58584 4.32298ZM5.88772 14.5862L5.34345 15.1022H5.34345L5.88772 14.5862ZM20.6578 9.88275L21.3923 10.0342L21.3933 10.0296L20.6578 9.88275ZM20.158 12.3075L20.8926 12.4589L20.158 12.3075ZM20.7345 6.69708L20.1401 7.15439L20.7345 6.69708ZM19.1336 15.0504L18.6598 14.469L19.1336 15.0504ZM5.70808 9.76V7.03836H4.20808V9.76H5.70808ZM2.50997 2.38429L2.24876 2.29246L1.75124 3.70754L2.01245 3.79938L2.50997 2.38429ZM10.9375 16.25H16.2404V14.75H10.9375V16.25ZM5.70808 7.03836C5.70808 6.3312 5.7091 5.7411 5.65719 5.26157C5.60346 4.76519 5.48705 4.31247 5.20507 3.89983L3.96661 4.74613C4.05687 4.87822 4.12657 5.05964 4.1659 5.42299C4.20706 5.8032 4.20808 6.29841 4.20808 7.03836H5.70808ZM2.01245 3.79938C2.68006 4.0341 3.11881 4.18965 3.44166 4.34806C3.74488 4.49684 3.87855 4.61727 3.96661 4.74613L5.20507 3.89983C4.92089 3.48397 4.54304 3.21763 4.10241 3.00143C3.68139 2.79485 3.14395 2.60719 2.50997 2.38429L2.01245 3.79938ZM4.20808 9.76C4.20808 11.2125 4.22171 12.2599 4.35876 13.0601C4.50508 13.9144 4.79722 14.5261 5.34345 15.1022L6.43198 14.0702C6.11182 13.7325 5.93913 13.4018 5.83723 12.8069C5.72607 12.1578 5.70808 11.249 5.70808 9.76H4.20808ZM10.9375 14.75C9.52069 14.75 8.53763 14.7482 7.79696 14.6432C7.08215 14.5418 6.70452 14.3576 6.43198 14.0702L5.34345 15.1022C5.93731 15.7286 6.69012 16.0013 7.58636 16.1283C8.45674 16.2518 9.56535 16.25 10.9375 16.25V14.75ZM4.95808 6.87H17.0888V5.37H4.95808V6.87ZM19.9232 9.73135L19.4235 12.1561L20.8926 12.4589L21.3923 10.0342L19.9232 9.73135ZM17.0888 6.87C17.9452 6.87 18.6989 6.871 19.2937 6.93749C19.5893 6.97053 19.8105 7.01643 19.9659 7.07105C20.1273 7.12776 20.153 7.17127 20.1401 7.15439L21.329 6.23978C21.094 5.93436 20.7636 5.76145 20.4632 5.65587C20.1567 5.54818 19.8101 5.48587 19.4604 5.44678C18.7646 5.369 17.9174 5.37 17.0888 5.37V6.87ZM21.3933 10.0296C21.5625 9.18167 21.7062 8.47024 21.7414 7.90038C21.7775 7.31418 21.7108 6.73617 21.329 6.23978L20.1401 7.15439C20.2021 7.23508 20.2706 7.38037 20.2442 7.80797C20.2168 8.25191 20.1002 8.84478 19.9223 9.73595L21.3933 10.0296ZM16.2404 16.25C17.0021 16.25 17.6413 16.2513 18.1566 16.1882C18.6923 16.1227 19.1809 15.9794 19.6074 15.6318L18.6598 14.469C18.5346 14.571 18.3571 14.6525 17.9744 14.6994C17.5712 14.7487 17.0397 14.75 16.2404 14.75V16.25ZM19.4235 12.1561C19.2621 12.9389 19.1535 13.4593 19.0238 13.8442C18.9007 14.2095 18.785 14.367 18.6598 14.469L19.6074 15.6318C20.0339 15.2842 20.2729 14.8346 20.4453 14.3232C20.6111 13.8312 20.7388 13.2049 20.8926 12.4589L19.4235 12.1561Z" fill="#1C274C"/>`,
    },
    {
      name: "Self-Service Portal",
      description:
        "Empower customers to file, track, and resolve tickets themselves with AI-suggested solutions and full conversation history.",
      link: "/account",
      linkText: "Try It",
      newPage: false,
      svgContent: `<path d="M10.5 22V20M14.5 22V20" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M11 20V20.75H11.75V20H11ZM14 19.25C13.5858 19.25 13.25 19.5858 13.25 20C13.25 20.4142 13.5858 20.75 14 20.75V19.25ZM17.5 5.25C17.0858 5.25 16.75 5.58579 16.75 6C16.75 6.41421 17.0858 6.75 17.5 6.75V5.25ZM7 5.25C6.58579 5.25 6.25 5.58579 6.25 6C6.25 6.41421 6.58579 6.75 7 6.75V5.25ZM9 19.25C8.58579 19.25 8.25 19.5858 8.25 20C8.25 20.4142 8.58579 20.75 9 20.75V19.25ZM15 20.75C15.4142 20.75 15.75 20.4142 15.75 20C15.75 19.5858 15.4142 19.25 15 19.25V20.75ZM10.25 11.25V20H11.75V11.25H10.25ZM11 19.25H4.23256V20.75H11V19.25ZM2.75 17.3953V11.25H1.25V17.3953H2.75ZM4.23256 19.25C3.51806 19.25 2.75 18.5323 2.75 17.3953H1.25C1.25 19.1354 2.48104 20.75 4.23256 20.75V19.25ZM6.5 6.75C8.46677 6.75 10.25 8.65209 10.25 11.25H11.75C11.75 8.04892 9.50379 5.25 6.5 5.25V6.75ZM6.5 5.25C3.49621 5.25 1.25 8.04892 1.25 11.25H2.75C2.75 8.65209 4.53323 6.75 6.5 6.75V5.25ZM21.25 11.25V17.4253H22.75V11.25H21.25ZM19.7931 19.25H14V20.75H19.7931V19.25ZM21.25 17.4253C21.25 18.5457 20.4934 19.25 19.7931 19.25V20.75C21.5305 20.75 22.75 19.1488 22.75 17.4253H21.25ZM22.75 11.25C22.75 8.04892 20.5038 5.25 17.5 5.25V6.75C19.4668 6.75 21.25 8.65209 21.25 11.25H22.75ZM7 6.75H18V5.37H7V6.75ZM9 20.75H15V19.25H9V20.75Z" fill="#1C274C"/>
<path d="M5 16H8" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
<path d="M16 9.88432V5.41121M16 5.41121V2.63519C16 2.39905 16.1676 2.19612 16.3994 2.15144L16.8855 2.05779C17.4738 1.94443 18.0821 1.99855 18.6412 2.214L18.7203 2.24451C19.2746 2.4581 19.8807 2.498 20.4582 2.35891C20.7343 2.2924 21 2.50168 21 2.78573V5.00723C21 5.2442 20.8376 5.45031 20.6073 5.5058L20.5407 5.52184C19.9095 5.67387 19.247 5.63026 18.6412 5.39679C18.0821 5.18135 17.4738 5.12722 16.8855 5.24058L16 5.41121Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`,
    },
    {
      name: "Advanced Analytics",
      description:
        "Generate real-time dashboards, track performance metrics, and unlock insights on how quickly and effectively tickets are resolved.",
      link: "/account",
      linkText: "Learn More",
      newPage: false,
      svgContent: `<path d="M3 22H21" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 11C3 10.0572 3 9.58579 3.29289 9.29289C3.58579 9 4.05719 9 5 9C5.94281 9 6.41421 9 6.70711 9.29289C7 9.58579 7 10.0572 7 11V17C7 17.9428 7 18.4142 6.70711 18.7071C6.41421 19 5.94281 19 5 19C4.05719 19 3.58579 19 3.29289 18.7071C3 18.4142 3 17.9428 3 17V11Z" stroke="#1C274C" stroke-width="1.5"/>
<path d="M10 7C10 6.05719 10 5.58579 10.2929 5.29289C10.5858 5 11.0572 5 12 5C12.9428 5 13.4142 5 13.7071 5.29289C14 5.58579 14 6.05719 14 7V17C14 17.9428 14 18.4142 13.7071 18.7071C13.4142 19 12.9428 19 12 19C11.0572 19 10.5858 19 10.2929 18.7071C10 18.4142 10 17.9428 10 17V7Z" stroke="#1C274C" stroke-width="1.5"/>
<path d="M17 4C17 3.05719 17 2.58579 17.2929 2.29289C17.5858 2 18.0572 2 19 2C19.9428 2 20.4142 2 20.7071 2.29289C21 2.58579 21 3.05719 21 4V17C21 17.9428 21 18.4142 20.7071 18.7071C20.4142 19 19.9428 19 19 19C18.0572 19 17.5858 19 17.2929 18.7071C17 18.4142 17 17.9428 17 17V4Z" stroke="#1C274C" stroke-width="1.5"/>`,
    },
  ]
</script>

<svelte:head>
  <title>AutoCRM</title>
  <meta name="description" content={WebsiteDescription} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html jsonldScript}
</svelte:head>

<div class="hero min-h-[60vh]">
  <div class="hero-content text-center py-12">
    <div class="max-w-xl">
      <div
        class="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-3 md:mb-7 pb-1"
      >
        AutoCRM Demo
      </div>

      <div
        class="text-4xl md:text-6xl font-bold px-2"
        style="line-height: 1.2;"
      >
        The
        <span
          class="underline decoration-secondary decoration-4 md:decoration-[6px]"
          >AI-Powered</span
        >
        CRM That Minimizes Your Workload
      </div>
      <div class="mt-6 md:mt-10 text-sm md:text-lg">
        <span class="font-bold"
          >Built on Supabase, SvelteKit, and Generative AI</span
        >,<br />
        empowering you to handle tickets, manage customers, and automate repetitive
        tasks.
      </div>
      <div class="mt-6 md:mt-2">
        <a href="/login/sign_up">
          <button class="btn btn-primary btn-sm px-6">Sign Up</button>
        </a>
        <a href="/login/sign_in">
          <button class="btn btn-outline btn-primary btn-sm px-6 mt-3 mx-2"
            >Log In</button
          >
        </a>
      </div>
    </div>
  </div>
</div>
<div class="min-h-[60vh]">
  <div class="pt-20 pb-8 px-7">
    <div class="max-w-lg mx-auto text-center">
      <div
        class="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent pb-2"
      >
        Key Features
      </div>
      <div class="mt-4 text-xl font-bold">
        Harness the Power of Generative AI
      </div>
    </div>

    <div
      class="flex gap-6 mt-12 max-w-[1064px] mx-auto place-content-center flex-wrap"
    >
      {#each features as feature}
        <div class="card bg-white w-[270px] min-h-[300px] flex-none shadow-xl">
          <div class="card-body items-center text-center p-[24px] pt-[32px]">
            <div>
              <svg
                width="50px"
                height="50px"
                class="mb-2 mt-1"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html feature.svgContent}
              </svg>
            </div>
            <h2 class="card-title">
              {feature.name}
            </h2>
            <p class="text-sm">
              {feature.description}
            </p>
            {#if feature.link}
              <a
                href={feature.link}
                class="pb-4"
                target={feature.newPage ? "_blank" : ""}
              >
                <button
                  class="btn btn-xs btn-outline rounded-full btn-primary min-w-[100px]"
                  >{feature.linkText ? feature.linkText : "Try It"}</button
                >
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
<div class="hero min-h-[60vh] mt-12">
  <div class="hero-content text-center pb-16 pt-4 px-4">
    <div class="max-w-lg">
      <div
        class="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mt-4 pb-2"
      >
        Deploy Seamlessly
      </div>
      <div
        class="flex flex-col lg:flex-row mt-6 gap-6 place-content-center content-center"
      >
        <div class="hidden md:block">
          <div class="mockup-browser border">
            <div class="mockup-browser-toolbar">
              <div class="input" style="background:#eee;">
                https://autocrm.app
              </div>
            </div>
            <div class="flex justify-center">
              <img
                alt="AutoCRM Demo Page"
                class="aspect-[2044/1242]"
                src="/images/example-home.png"
              />
            </div>
          </div>
        </div>
        <div class="md:hidden">
          <div class="card shadow-xl border overflow-hidden">
            <img
              alt="AutoCRM Demo Page"
              class="aspect-[2044/1242]"
              src="/images/example-home.png"
            />
          </div>
        </div>
        <div class="min-w-[270px] lg:min-w-[420px] flex mt-6 lg:mt-0">
          <div class="my-auto">
            <div class="px-4 text-lg md:text-xl">
              AutoCRM integrates AI for your customer management workflows,
              helping you:
            </div>
            <ul class="list-disc list-inside text-left px-6 py-4">
              <li>Reduce repetitive manual tasks with AI responses</li>
              <li>Provide advanced self-service ticketing to customers</li>
              <li>Coordinate your support teams effectively</li>
            </ul>
            <div class="px-4 mt-6 text-lg md:text-xl">
              Get started with our sign-up, then explore the admin panel to
              experience AI-driven ticket resolution in action.
            </div>
            <div class="mt-4 text-large">
              <a href="/login/sign_up">
                <button class="btn btn-primary btn-wide mt-3">
                  Sign Up Now
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
