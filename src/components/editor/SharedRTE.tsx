import { useRichField } from './RichFieldContext'
import { RichTextEditor } from './RichTextEditor'

export function SharedRTE() {
  const { active } = useRichField()

  return (
    <div className="shared-rte">
      {active ? (
        <>
          <div className="shared-rte-label">{active.label}</div>
          {/* key forces remount when switching fields, giving the editor fresh content */}
          <RichTextEditor
            key={active.id}
            value={active.value}
            onChange={active.onChange}
            placeholder={active.placeholder}
            multiline={active.multiline}
          />
        </>
      ) : (
        <div className="shared-rte-empty">Click a text field above to edit</div>
      )}
    </div>
  )
}
