import { Component, Input } from '@angular/core';

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-ui-badge',
  templateUrl: './ui-badge.component.html',
  styleUrls: ['./ui-badge.component.scss'],
})
export class UiBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
}