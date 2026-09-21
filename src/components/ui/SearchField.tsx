import { forwardRef, type ComponentProps } from "react";
import { Input as AriaInput, SearchField as AriaSearchField } from "react-aria-components";

// Intent UI search-field anatomy, adapted to Wanderland's semantic CSS.
// https://intentui.com/docs/components/forms/search-field
export function SearchField(props: ComponentProps<typeof AriaSearchField>) {
  return <AriaSearchField data-slot="search-field" {...props} />;
}

export const SearchInput = forwardRef<HTMLInputElement, ComponentProps<typeof AriaInput>>((props, ref) => <AriaInput ref={ref} data-slot="input" {...props} />);
SearchInput.displayName = "SearchInput";
