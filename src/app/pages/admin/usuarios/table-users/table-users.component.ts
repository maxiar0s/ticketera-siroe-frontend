import { Component } from '@angular/core';
import { LoaderComponent } from '../../../../shared/loader/loader.component';
import { LoaderService } from '../../../../services/loader.service';

@Component({
  selector: 'admin-usuarios-table',
  standalone: true,
  imports: [LoaderComponent],
  templateUrl: './table-users.component.html',
  styleUrl: './table-users.component.css'
})
export class TableUsersComponent {
  constructor(
    public loaderService: LoaderService
  ) {}
}
