import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { UsuarioRoutingModule } from './usuario-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { PerfilComponent } from './pages/perfil/perfil.component';


@NgModule({
  declarations: [
    PerfilComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    UsuarioRoutingModule,
  ],
})
export class UsuarioModule {}