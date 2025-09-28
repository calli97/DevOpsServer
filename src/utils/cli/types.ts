export interface CLIOption {
  tag: string | boolean;
}

export interface InquirerOption {
  type: string;
  name: string;
  message: string;
  choices: string[];
}
