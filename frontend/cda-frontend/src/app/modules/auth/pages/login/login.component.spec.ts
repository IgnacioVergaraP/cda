import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let result: Subject<void>;
  let auth: { login: jasmine.Spy; usuarioActual: { rol: string } };
  let router: { navigateByUrl: jasmine.Spy };
  let redirect: string | null;

  beforeEach(async () => {
    result = new Subject<void>();
    auth = { login: jasmine.createSpy('login').and.returnValue(result), usuarioActual: { rol: 'alumno' } };
    router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };
    redirect = null;
    await TestBed.configureTestingModule({
      declarations: [LoginComponent, UiInputComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => redirect } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates the form before contacting authentication', () => {
    component.onSubmit();
    fixture.detectChanges();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component.emailCtrl.touched).toBeTrue();
    expect(fixture.nativeElement.querySelectorAll('[aria-invalid="true"]').length).toBe(2);
  });

  it('toggles password visibility without submitting', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.ui-input__action');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[autocomplete="current-password"]').type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Ocultar contraseña');
    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[autocomplete="current-password"]').type).toBe('password');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('blocks duplicate submissions and presents authentication errors', () => {
    component.form.setValue({ email: 'alumno@example.com', password: 'valid-password' });
    component.onSubmit();
    component.onSubmit();
    fixture.detectChanges();
    expect(auth.login).toHaveBeenCalledOnceWith('alumno@example.com', 'valid-password');
    expect(fixture.nativeElement.querySelector('.login__submit').disabled).toBeTrue();
    result.error(new Error('Invalid login credentials'));
    fixture.detectChanges();
    expect(component.enviando).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Email o contraseña incorrectos.');
    expect(fixture.nativeElement.querySelector('.login__submit').disabled).toBeFalse();
  });

  for (const [rol, target] of [['alumno', '/rutinas'], ['profesor', '/profesor'], ['gimnasio', '/admin']]) {
    it('preserves the default redirect for ' + rol, () => {
      auth.usuarioActual.rol = rol;
      component.form.setValue({ email: 'usuario@example.com', password: 'valid-password' });
      component.onSubmit();
      result.next();
      result.complete();
      expect(router.navigateByUrl).toHaveBeenCalledWith(target);
      expect(component.enviando).toBeFalse();
    });
  }

  it('preserves the requested redirect', () => {
    redirect = '/maquinas';
    component.form.setValue({ email: 'usuario@example.com', password: 'valid-password' });
    component.onSubmit();
    result.next();
    result.complete();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/maquinas');
  });
});
