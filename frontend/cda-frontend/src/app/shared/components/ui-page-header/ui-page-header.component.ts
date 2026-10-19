import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ui-page-header',
  templateUrl: './ui-page-header.component.html',
  styleUrls: ['./ui-page-header.component.scss'],
})
export class UiPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}