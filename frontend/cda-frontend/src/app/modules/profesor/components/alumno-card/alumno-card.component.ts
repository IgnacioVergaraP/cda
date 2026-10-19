import { Component, Input } from '@angular/core';
import { AlumnoListItem } from '../../models/alumno.model';

@Component({
  selector: 'app-alumno-card',
  templateUrl: './alumno-card.component.html',
  styleUrls: ['./alumno-card.component.scss'],
})
export class AlumnoCardComponent {

  @Input() alumno!: AlumnoListItem;
}