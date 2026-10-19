import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';

@NgModule({
  declarations: [
    BottomNavComponent,
    AppHeaderComponent,
    AdminSidebarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: [
    BottomNavComponent,
    AppHeaderComponent,
    AdminSidebarComponent,
  ],
})
export class LayoutModule {}