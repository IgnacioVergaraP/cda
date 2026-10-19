import { Component, EventEmitter, Input, Output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.scss'],
})
export class UiButtonComponent {

  @Input() variant: ButtonVariant = 'primary';
  @Input() type: ButtonType = 'button';
  @Input() block = false;
  @Input() disabled = false;
  @Input() loading = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  onClick(ev: MouseEvent): void {
    if (this.disabled || this.loading) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    this.clicked.emit(ev);
  }

  get classes(): string {
    const list = ['ui-button', `ui-button--${this.variant}`];
    if (this.block) list.push('ui-button--block');
    if (this.loading) list.push('ui-button--loading');
    return list.join(' ');
  }
}