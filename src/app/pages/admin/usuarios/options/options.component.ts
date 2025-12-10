import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'admin-usuario-options',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css',
})
export class OptionsComponent {
  @Output() optionSelected = new EventEmitter<string>();
  public searchTerm: string = '';

  constructor() {}

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  onSearch(): void {
    this.optionSelected.emit(this.searchTerm);
  }

  onClear(): void {
    this.searchTerm = '';
    this.optionSelected.emit('');
  }
}
