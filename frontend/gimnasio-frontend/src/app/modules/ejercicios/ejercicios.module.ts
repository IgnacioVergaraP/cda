import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ListaComponent } from './pages/lista/lista.component';
import { DetalleComponent } from './pages/detalle/detalle.component';

@NgModule({ imports: [RouterModule.forChild([
  { path: '', component: ListaComponent },
  { path: ':id', component: DetalleComponent },
])] })
export class EjerciciosModule {}
