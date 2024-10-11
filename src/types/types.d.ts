export interface Config {
  appName: string;
  version: string;
  createdAt: string;
  invoices_path: string;
  default_values: DefaultValueTypes
}

export interface DefaultOption<T extends 'input' | 'number' = 'input'> {
  required: boolean;
  type: T
  message: string
  validate: (value: T extends 'number' ? number : string) => void
}

type RequiredDefaultValues<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K
}[keyof T]

type OptionalDefaultValues<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

type DefaultValueTypes = {
  [K in RequiredDefaultValues<DefaultOptionPrompts>]: any
} & {
  [K in OptionalDefaultValues<DefaultOptionPrompts>]?: any
}

export interface DefaultOptionPrompts {
  sortCode: DefaultOption
  bankNum: DefaultOption<"number">
  fullName: DefaultOption
  address: DefaultOption
  postcode: DefaultOption
  email: DefaultOption
  logo?: DefaultOption
}

export interface InvoiceItem {
  itemName: string;
  price: number;
}

export type TInvoice = { [key: string]: string | InvoiceItem[] }


