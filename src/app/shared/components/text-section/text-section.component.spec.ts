import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextSectionComponent } from './text-section.component';

describe('TextSectionComponent', () => {
  let component: TextSectionComponent;
  let fixture: ComponentFixture<TextSectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextSectionComponent]
    });
    fixture = TestBed.createComponent(TextSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
