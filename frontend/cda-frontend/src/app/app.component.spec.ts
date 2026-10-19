import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './modules/auth/services/auth.service';
import { GimnasioConfigService } from './core/services/gimnasio-config.service';

describe('AppComponent authentication layout', () => {
  let router: { url: string; events: Subject<NavigationEnd> };

  beforeEach(async () => {
    router = { url: '/auth', events: new Subject<NavigationEnd>() };
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [AppComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { usuario$: new BehaviorSubject(null) } },
        { provide: GimnasioConfigService, useValue: { config$: of({ nombre: 'Gym', logo_url: null }) } },
      ],
    }).compileComponents();
  });

  it('uses the full width authentication layout without duplicate branding or navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-shell--auth')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.app-gym-brand')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).toBeNull();
  });

  it('restores the normal layout after leaving authentication', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    router.url = '/rutinas';
    router.events.next(new NavigationEnd(1, '/rutinas', '/rutinas'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-shell--auth')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-gym-brand')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).not.toBeNull();
  });
});
