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
  private readonly debugRichText = false;
  private quillEditorInstance: any = null;
  private toolbarInteracting = false;

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

    if (this.debugRichText) {
      console.warn('[RTE] writeValue', {
        length: this.content.length,
        hasStrong: /<\/?(strong|b)\b/i.test(this.content),
        preview: this.content.slice(0, 180),
      });
    }
  }

  onEditorCreated(editor: any): void {
    this.quillEditorInstance = editor;

    const toolbarContainer = editor?.getModule?.('toolbar')?.container;
    if (toolbarContainer?.addEventListener) {
      toolbarContainer.addEventListener('mousedown', () => {
        this.toolbarInteracting = true;
        setTimeout(() => {
          this.toolbarInteracting = false;
        }, 0);
      });
    }

    if (!this.debugRichText) {
      return;
    }

    console.warn('[RTE] editorCreated', {
      hasEditor: !!editor,
      toolbar: this.quillModules?.toolbar,
    });

    const root = editor?.root;
    if (root?.addEventListener) {
      root.addEventListener('click', () => {
        try {
          const range = editor.getSelection();
          const formats = range ? editor.getFormat(range.index, range.length || 0) : {};
          console.warn('[RTE] root click', { range, formats });
        } catch {
          console.warn('[RTE] root click without range');
        }
      });
    }
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
    if (this.debugRichText) {
      let formats: Record<string, unknown> = {};
      if (event?.editor && event?.range) {
        try {
          formats = event.editor.getFormat(event.range.index, event.range.length || 0) || {};
        } catch {
          formats = {};
        }
      }

      console.warn('[RTE] selectionChanged', {
        source: event?.source,
        range: event?.range,
        oldRange: event?.oldRange,
        formats,
      });
    }

    if (!event || event.source !== 'user' || !event.range || event.range.length > 0) {
      return;
    }

    if (this.toolbarInteracting) {
      return;
    }

    const editor = event.editor;
    if (!editor) {
      return;
    }

    const formatos = editor.getFormat(event.range.index, 0);
    const tieneFormatoActivo = !!(
      formatos.bold ||
      formatos.italic ||
      formatos.underline ||
      formatos.strike ||
      formatos.link ||
      formatos.list ||
      formatos.align
    );

    if (!tieneFormatoActivo) {
      this.resetToolbarActiveState();
      return;
    }

    const inline = ['bold', 'italic', 'underline', 'strike', 'link'];
    let actualizado = false;

    inline.forEach((formato) => {
      if (formatos[formato]) {
        editor.format(formato, false, 'silent');
        actualizado = true;
      }
    });

    if (formatos.list) {
      editor.format('list', false, 'silent');
      actualizado = true;
    }

    if (formatos.align) {
      editor.format('align', false, 'silent');
      actualizado = true;
    }

    if (actualizado) {
      editor.setSelection(event.range.index, 0, 'silent');
      this.resetToolbarActiveState();
    }
  }

  private resetToolbarActiveState(): void {
    const toolbarContainer =
      this.quillEditorInstance?.getModule?.('toolbar')?.container;

    if (!toolbarContainer) {
      return;
    }

    const activeButtons = toolbarContainer.querySelectorAll('button.ql-active');
    activeButtons.forEach((button: HTMLElement) => {
      button.classList.remove('ql-active');
      button.setAttribute('aria-pressed', 'false');
    });

    const expandedPickers = toolbarContainer.querySelectorAll('.ql-picker.ql-expanded');
    expandedPickers.forEach((picker: HTMLElement) => {
      picker.classList.remove('ql-expanded');
    });
  }
}
