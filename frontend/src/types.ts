export interface CustomFile extends Partial<globalThis.File> {
  processing: string;
  status: string;
  NodesCount: number;
  id: string;
  relationshipCount: number;
}

export interface OptionType {
  value: string;
  label: string;
}

export interface DropdownProps {
  onSelect: (option: OptionType | null | void) => void;
}