import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicRendererComponent } from './dynamic-renderer.component';

describe('DynamicRendererComponent', () => {
  let component: DynamicRendererComponent;
  let fixture: ComponentFixture<DynamicRendererComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DynamicRendererComponent]
    });
    fixture = TestBed.createComponent(DynamicRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
