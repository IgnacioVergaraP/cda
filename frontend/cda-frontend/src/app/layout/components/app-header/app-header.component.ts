import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() showBack = false;

  constructor(private location: Location) {}

  onBack(): void {
    this.location.back();
  }
}