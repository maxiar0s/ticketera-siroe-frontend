import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'Escribe aquí...';
  @Input() minHeight: string = '120px';
  @Input() disabled: boolean = false;
  @Output() contentChanged = new EventEmitter<string>();

  content: string = '';

  // Quill toolbar modules configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  // ControlValueAccessor methods
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.content = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onContentChange(event: any): void {
    const html = event.html || '';
    this.onChange(html);
    this.contentChanged.emit(html);
  }

  onEditorBlur(): void {
    this.onTouched();
  }

  onSelectionChange(event: any): void {
    if (!event || event.source !== 'user' || !event.range || event.range.length > 0) {
      return;
    }

    const editor = event.editor;
    if (!editor) {
      return;
    }

    const formatos = editor.getFormat(event.range);
    const formatosInline = ['bold', 'italic', 'underline', 'strike', 'link'];

    formatosInline.forEach((formato) => {
      if (formatos[formato]) {
        editor.format(formato, false, 'silent');
      }
    });

    if (formatos.list) {
      editor.format('list', false, 'silent');
    }

    if (formatos.align) {
      editor.format('align', false, 'silent');
    }
  }
}
