import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-empty-state',
  templateUrl: './ui-empty-state.component.html',
  styleUrls: ['./ui-empty-state.component.scss'],
})
export class UiEmptyStateComponent {
  @Input() icon = 'bi-inbox';
  @Input() title = '';
  @Input() message = '';
}