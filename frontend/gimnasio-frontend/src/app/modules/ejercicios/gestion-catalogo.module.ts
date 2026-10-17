import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ListaComponent } from './pages/lista/lista.component';
import { EditorComponent } from './pages/editor/editor.component';
import { RecursosComponent } from './pages/recursos/recursos.component';

@NgModule({ imports: [RouterModule.forChild([
  { path: '', component: ListaComponent, data: { gestion: true } },
  { path: 'recursos', component: RecursosComponent },
  { path: 'nuevo', component: EditorComponent },
  { path: ':id/editar', component: EditorComponent },
])] })
export class GestionCatalogoModule {}
