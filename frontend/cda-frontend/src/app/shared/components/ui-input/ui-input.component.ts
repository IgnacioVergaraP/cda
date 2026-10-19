import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextId = 0;

type InputType = 'text' | 'email' | 'password' | 'number';

@Component({
  selector: 'app-ui-input',
  templateUrl: './ui-input.component.html',
  styleUrls: ['./ui-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
})
export class UiInputComponent implements ControlValueAccessor {

  @Input() appearance: 'default' | 'dark' = 'default';
  @Input() label = '';
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() error = '';
  @Input() icon = '';              // ej: 'bi-envelope', 'bi-lock'

  value = '';
  disabled = false;
  mostrarPassword = false;

  readonly inputId = `ui-input-${nextId++}`;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value = v;
    this.onChange(v);
  }

  handleBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  get tipoEfectivo(): InputType {
    if (this.type === 'password' && this.mostrarPassword) return 'text';
    return this.type;
  }

  get esPassword(): boolean {
    return this.type === 'password';
  }
}