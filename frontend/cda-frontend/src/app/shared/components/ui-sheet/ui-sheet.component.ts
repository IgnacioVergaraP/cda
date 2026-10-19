import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-ui-sheet',
  templateUrl: './ui-sheet.component.html',
  styleUrls: ['./ui-sheet.component.scss'],
})
export class UiSheetComponent {

  @Input() visible = false;
  @Input() title = '';

  @Output() closed = new EventEmitter<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onCloseClick(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }
}