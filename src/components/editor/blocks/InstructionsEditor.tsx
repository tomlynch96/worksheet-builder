import type { InstructionsBlock } from '../../../types/worksheet'
import type { WorksheetAction } from '../../../hooks/useWorksheet'
import { ListEditor } from '../EditorPrimitives'

interface Props {
  block: InstructionsBlock
  dispatch: React.Dispatch<WorksheetAction>
}

export function InstructionsEditor({ block, dispatch }: Props) {
  return (
    <div className="block-fields">
      <ListEditor
        items={block.items}
        onChange={items => dispatch({ type: 'UPDATE_BLOCK', id: block.id, updates: { items } })}
        placeholder="Instruction…"
        addLabel="+ Add instruction"
      />
    </div>
  )
}
