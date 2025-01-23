declare module "svelte-quill" {
  import { SvelteComponent } from "svelte"
  export default class QuillEditor extends SvelteComponent<{
    value?: string
    theme?: string
    class?: string
    id?: string
  }> {}
}
