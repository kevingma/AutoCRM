<script lang="ts">
  import { page } from "$app/stores"
  import { browser, dev } from "$app/environment"
  import { onMount } from "svelte"
  import { goto } from "$app/navigation"
  import Fuse from "fuse.js"
  import type { FuseResult } from "fuse.js"

  interface SearchDoc {
    title: string
    description: string
    body: string
    path: string
  }

  let fuse: Fuse<SearchDoc> | undefined
  let loading = $state(true)
  let error = $state(false)

  // The search results come back as Fuse.FuseResult<SearchDoc>[]
  let results: FuseResult<SearchDoc>[] = $state([])

  onMount(async () => {
    try {
      const response = await fetch("/search/api.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const searchData = await response.json()
      if (searchData && searchData.index && searchData.indexData) {
        const index = Fuse.parseIndex<SearchDoc>(searchData.index)
        fuse = new Fuse(
          searchData.indexData,
          {
            keys: [
              { name: "title", weight: 3 },
              { name: "description", weight: 2 },
              { name: "body", weight: 1 },
            ],
            ignoreLocation: true,
            threshold: 0.3,
          },
          index,
        )
      }
    } catch (e) {
      console.error("Failed to load search data", e)
      error = true
    } finally {
      loading = false
      document.getElementById("search-input")?.focus()
    }
  })

  let searchQuery = $state(decodeURIComponent($page.url.hash.slice(1) ?? ""))

  $effect(() => {
    if (fuse) {
      results = fuse.search(searchQuery)
    }
  })

  $effect(() => {
    if (browser && window.location.hash.slice(1) !== searchQuery) {
      goto("#" + searchQuery, { keepFocus: true })
    }
  })

  let focusItem = $state(0)
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      searchQuery = ""
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      focusItem += event.key === "ArrowDown" ? 1 : -1
      if (focusItem < 0) {
        focusItem = 0
      } else if (focusItem > results.length) {
        focusItem = results.length
      }
      if (focusItem === 0) {
        document.getElementById("search-input")?.focus()
      } else {
        document.getElementById(`search-result-${focusItem}`)?.focus()
      }
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} />

<svelte:head>
  <title>Search AutoCRM</title>
  <meta name="description" content="Search the AutoCRM site." />
</svelte:head>

<div class="py-8 lg:py-12 px-6 max-w-lg mx-auto">
  <div
    class="text-3xl lg:text-5xl font-medium text-primary flex gap-3 items-baseline text-center place-content-center"
  >
    <div
      class="text-center leading-relaxed font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent"
    >
      Search
    </div>
  </div>
  <label class="input input-bordered flex items-center gap-2 mt-10">
    <input
      id="search-input"
      type="text"
      class="grow"
      placeholder="Search"
      bind:value={searchQuery}
      onfocus={() => (focusItem = 0)}
      aria-label="Search input"
    />
  </label>

  {#if loading && searchQuery.length > 0}
    <div class="text-center mt-10 text-accent text-xl">Loading...</div>
  {/if}

  {#if error}
    <div class="text-center mt-10 text-accent text-xl">
      Error connecting to search. Please try again later.
    </div>
  {/if}

  {#if !loading && searchQuery.length > 0 && results.length === 0 && !error}
    <div class="text-center mt-10 text-accent text-xl">No results found</div>
    {#if dev}
      <div class="text-center mt-4 font-mono">
        Development mode only: rebuild your local search index with
        <code>npm run build</code>.
      </div>
    {/if}
  {/if}

  <div>
    {#each results as result, i}
      <a
        href={result.item.path || "/"}
        id="search-result-{i + 1}"
        class="card my-6 bg-white shadow-xl flex-row overflow-hidden focus:border"
      >
        <div class="flex-none w-6 md:w-32 bg-secondary"></div>
        <div class="py-6 px-6">
          <div class="text-xl">{result.item.title}</div>
          <div class="text-sm text-accent">
            {result.item.path}
          </div>
          <div class="text-slate-500">{result.item.description}</div>
        </div>
      </a>
    {/each}
  </div>
</div>
