
import { Plugin } from '@ckeditor/ckeditor5-core/src/index.js';
import { WidgetResize } from '@ckeditor/ckeditor5-widget/src/index.js';
// import { MediaEmbedEditing } from '@ckeditor/ckeditor5-media-embed/src/mediaembedediting';

export default class MediaResizeHandles extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WidgetResize ];
    // return [ WidgetResize, MediaEmbedEditing ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'MediaResizeHandles';
	}

	/**
	 * @inheritDoc
	 */
	init() {
    this.editor.model.document.on( 'change:data', () => {
      setTimeout(() => this.addResizer(), 0);
    } );

    const allowedAttributes = [
      'url',
      'style',
      'title'
    ];

    this.editor.model.schema.extend('media', { allowAttributes: allowedAttributes });

    for (var i = 0; i < allowedAttributes.length; i++) {
      this.editor.conversion.attributeToAttribute({ model: allowedAttributes[i], view: allowedAttributes[i] });
    }

    this.editor.model.schema.extend('media', { allowAttributes: '__style' });

    this.editor.conversion.for('upcast').attributeToAttribute({
        model: {
            key: '__style',
            name: 'media'
        },
        view: 'style'
    });

    this.editor.conversion.for('downcast').add(dispatcher => {
        dispatcher.on('attribute:__style:media', (evt, data, conversionApi) => {
            conversionApi.consumable.consume(data.item, evt.name);

            const viewElement = conversionApi.mapper.toViewElement(data.item);

            conversionApi.writer.setAttribute('style', data.attributeNewValue, viewElement);
        });
    });

	}


  /**
   * Find media elements that need resizer
   */
  addResizer( ) {

    const viewEditableRoot = this.editor.editing.view.document.getRoot();

    for ( const viewElement of viewEditableRoot.getChildren() ) {
      const classNames = Array.from(viewElement.getClassNames());

      if (viewElement.name === 'figure' && classNames.includes('media') && classNames.includes('ck-widget') ) {
        const modelElement = this.editor.editing.mapper.toModelElement( viewElement );
        if (!viewElement || !viewElement) {
          continue;
        }
        this.attachResizer(viewElement, modelElement) 
      }
    }

  }

  /**
   * Attach resizer to media widget
   * @param {*} viewElement 
   * @param {*} modelElement 
   * @returns 
   */
  attachResizer(viewElement, modelElement) {

    if ( this.editor.plugins.get( WidgetResize ).getResizerByViewElement( viewElement ) ) {
      return null;
    }

    const resizer = this.editor.plugins
      .get( WidgetResize )
      .attachTo( {
        unit: 'px',            
        modelElement,
        viewElement,
        editor: this.editor,

        getHandleHost( domWidgetElement ) {
          return domWidgetElement.querySelector( '.ck-media__wrapper' );
        },
        getResizeHost() {
          return this.editor.editing.view.domConverter.viewToDom( 
            this.editor.editing.mapper.toViewElement( modelElement.parent ) );
        },

        onCommit( newValue ) {

          this.editor.editing.view.change( writer => {
            if (!viewElement) {
              return null;
            }
            writer.setStyle( 'width', newValue, viewElement );
            writer.setStyle( 'margin', '0 auto', viewElement );

            writer.setAttribute('__style', `width: ${newValue};`,modelElement);

          } );
        },

      });

    resizer.bind( 'isEnabled' ).to( this );

  }
}
