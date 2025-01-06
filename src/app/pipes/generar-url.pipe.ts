import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Observable } from 'rxjs';

@Pipe({
  name: 'signedUrl',
  standalone: true
})
export class SignedUrlPipe implements PipeTransform {
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  transform(fileName: string): Observable<string> {
    return this.apiService.signedUrl(fileName);
  }
}
