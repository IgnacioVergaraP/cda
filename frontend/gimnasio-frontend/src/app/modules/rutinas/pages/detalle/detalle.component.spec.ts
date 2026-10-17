import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { DetalleComponent } from './detalle.component';
import { RutinaDetalleModule } from '../../rutina-detalle.module';
import { RutinasService } from '../../services/rutinas.service';
import { Rutina } from '../../models/rutina.model';

const publicacion = {
  id: 'publica-1', titulo: 'Entrenamiento de tenis', es_publica: true,
  profesor_nombre: 'Profesora Ana', disciplina: 'tenis', nivel: 'principiante',
  objetivo: 'Mejorar la fuerza', equipamiento: 'Sin equipamiento',
  grupos_musculares: [], copia_id: null,
  ejercicios: [{ id: 'e-1', tipo: 'libre', nombre: 'Sentadillas', series: 3, repeticiones: '12', peso_sugerido: 'Corporal' }],
} as unknown as Rutina;

describe('Guardar una publicación desde Explorar', () => {
  let service: jasmine.SpyObj<RutinasService>;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    service = jasmine.createSpyObj('RutinasService', ['obtenerPublica', 'obtenerDetalle', 'guardarPublica']);
    service.obtenerPublica.and.returnValue(of(publicacion));
    service.guardarPublica.and.returnValue(of({ ...publicacion, id: 'copia-1', es_publica: false }));
    await TestBed.configureTestingModule({
      imports: [RutinaDetalleModule],
      providers: [
        provideRouter([
          { path: 'explorar/:id', component: DetalleComponent, data: { esPublica: true } },
          { path: 'rutinas/:id', component: DetalleComponent },
        ]),
        { provide: RutinasService, useValue: service },
      ],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  it('permite guardar una copia y lleva a su detalle, sin registrar series en el original', async () => {
    await harness.navigateByUrl('/explorar/publica-1', DetalleComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const el = harness.routeNativeElement!;
    expect(el.querySelector('.ejercicio-item__register')).toBeNull();
    expect(el.textContent).toContain('Profesora Ana');
    const guardar = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Agregar a mis rutinas')!;
    guardar.click();
    expect(service.guardarPublica).toHaveBeenCalledWith('publica-1');
    expect(navigate).toHaveBeenCalledWith(['/rutinas', 'copia-1']);
  });

  it('abre la copia que ya existe sin volver a guardarla', async () => {
    service.obtenerPublica.and.returnValue(of({ ...publicacion, copia_id: 'copia-1' }));
    await harness.navigateByUrl('/explorar/publica-1', DetalleComponent);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    Array.from(harness.routeNativeElement!.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Ver en mis rutinas')!.click();
    expect(service.guardarPublica).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/rutinas', 'copia-1']);
  });

  it('la copia permite editar y registrar progreso, conservando la autoría', async () => {
    service.obtenerDetalle.and.returnValue(of({ ...publicacion, id: 'copia-1', es_publica: false, rutina_origen_id: 'publica-1' }));
    await harness.navigateByUrl('/rutinas/copia-1', DetalleComponent);
    const el = harness.routeNativeElement!;
    expect(el.querySelector('.ejercicio-item__register')).not.toBeNull();
    expect(el.textContent).toContain('Profesora Ana');
    expect(el.textContent).toContain('Editar mi rutina');
    expect(el.textContent).not.toContain('Agregar a mis rutinas');
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    Array.from(el.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Editar mi rutina')!.click();
    expect(navegar.calls.mostRecent().args[0].toString()).toBe('/rutinas/copia-1/editar');
  });
});
