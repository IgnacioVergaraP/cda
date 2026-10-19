import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogoComponent } from './catalogo.component';
import { RutinasService } from '../../../rutinas/services/rutinas.service';
import { Rutina } from '../../../rutinas/models/rutina.model';
import { PaginaPublicaciones } from '../../../rutinas/models/publicacion.model';

const rutina = {
  id: 'publica-1', titulo: 'Preparación para tenis', disciplina: 'tenis', nivel: 'principiante',
  profesor_nombre: 'Profesora Ana', objetivo: 'Mejorar la fuerza', equipamiento: 'Sin equipamiento',
  ejercicios: [], activa: true, es_publica: true,
} as unknown as Rutina;

describe('Explorar y gestionar publicaciones', () => {
  let service: jasmine.SpyObj<RutinasService>;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    service = jasmine.createSpyObj('RutinasService', ['listarPublicas', 'cambiarPublicacion']);
    service.listarPublicas.and.returnValue(of({ items: [rutina], hay_mas: false }));
    await TestBed.configureTestingModule({
      imports: [CatalogoComponent],
      providers: [
        provideRouter([
          { path: 'explorar', component: CatalogoComponent },
          { path: 'profesor/publicaciones', component: CatalogoComponent, data: { gestion: true } },
        ]),
        { provide: RutinasService, useValue: service },
      ],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });

  it('muestra el entrenamiento con autoría y enlace al detalle para el alumno', async () => {
    await harness.navigateByUrl('/explorar', CatalogoComponent);
    const el = harness.routeNativeElement!;
    expect(el.textContent).toContain('Preparación para tenis');
    expect(el.textContent).toContain('Profesora Ana');
    expect(el.querySelector('.catalogo__enlace')?.getAttribute('href')).toBe('/explorar/publica-1');
    expect(el.querySelector('.catalogo__gestion')).toBeNull();
    expect(service.listarPublicas).toHaveBeenCalledWith({ buscar: '', disciplina: '', nivel: '', desde: 0 }, false);
  });

  it('aplica los filtros seleccionados a la búsqueda', async () => {
    await harness.navigateByUrl('/explorar', CatalogoComponent);
    const select = harness.routeNativeElement!.querySelector('#catalogo-disciplina') as HTMLSelectElement;
    select.value = 'tenis';
    select.dispatchEvent(new Event('change'));
    harness.detectChanges();
    expect(service.listarPublicas).toHaveBeenCalledWith({ buscar: '', disciplina: 'tenis', nivel: '', desde: 0 }, false);
  });

  it('cancela la búsqueda anterior al aplicar otro filtro', async () => {
    const anterior = new Subject<PaginaPublicaciones>();
    service.listarPublicas.and.returnValue(anterior);
    const component = await harness.navigateByUrl('/explorar', CatalogoComponent);
    service.listarPublicas.and.returnValue(of({ items: [], hay_mas: false }));
    component.disciplina = 'futbol';
    component.cargar();
    anterior.next({ items: [rutina], hay_mas: true });
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('.catalogo__card').length).toBe(0);
    expect(harness.routeNativeElement!.textContent).toContain('Sin rutinas para mostrar');
  });

  it('retira una publicación y ofrece volver a publicarla', async () => {
    service.cambiarPublicacion.and.returnValue(of({ ...rutina, activa: false }));
    await harness.navigateByUrl('/profesor/publicaciones', CatalogoComponent);
    const buttons = Array.from(harness.routeNativeElement!.querySelectorAll('button'));
    buttons.find(b => b.textContent?.trim() === 'Retirar')!.click();
    harness.detectChanges();
    expect(service.cambiarPublicacion).toHaveBeenCalledWith('publica-1', false);
    expect(harness.routeNativeElement!.textContent).toContain('Retirada de Explorar');
    expect(harness.routeNativeElement!.textContent).toContain('Volver a publicar');
  });

  it('muestra un error de retiro sin ocultar la publicación', async () => {
    service.cambiarPublicacion.and.returnValue(throwError(() => new Error('Fallo')));
    await harness.navigateByUrl('/profesor/publicaciones', CatalogoComponent);
    const buttons = Array.from(harness.routeNativeElement!.querySelectorAll('button'));
    buttons.find(b => b.textContent?.trim() === 'Retirar')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('No se pudo cambiar la publicación.');
    expect(harness.routeNativeElement!.textContent).toContain('Preparación para tenis');
  });
});
