import type { Block } from '../../types/worksheet'
import type { WorksheetAction } from '../../hooks/useWorksheet'
import { HeaderEditor } from './blocks/HeaderEditor'
import { InstructionsEditor } from './blocks/InstructionsEditor'
import { QuestionEditor } from './blocks/QuestionEditor'
import { MultipleChoiceEditor } from './blocks/MultipleChoiceEditor'
import { WorkedExampleEditor } from './blocks/WorkedExampleEditor'
import { InformationEditor } from './blocks/InformationEditor'
import { MatchThemUpEditor } from './blocks/MatchThemUpEditor'
import { ClozeEditor } from './blocks/ClozeEditor'
import { OrderStepsEditor } from './blocks/OrderStepsEditor'
import { FigureEditor } from './blocks/FigureEditor'
import { SpacerEditor } from './blocks/SpacerEditor'

interface Props {
  block: Block
  dispatch: React.Dispatch<WorksheetAction>
}

export function BlockEditor({ block, dispatch }: Props) {
  switch (block.type) {
    case 'header':          return <HeaderEditor block={block} dispatch={dispatch} />
    case 'instructions':    return <InstructionsEditor block={block} dispatch={dispatch} />
    case 'question':        return <QuestionEditor block={block} dispatch={dispatch} />
    case 'multiple_choice': return <MultipleChoiceEditor block={block} dispatch={dispatch} />
    case 'worked_example':  return <WorkedExampleEditor block={block} dispatch={dispatch} />
    case 'information':     return <InformationEditor block={block} dispatch={dispatch} />
    case 'match_them_up':   return <MatchThemUpEditor block={block} dispatch={dispatch} />
    case 'cloze':           return <ClozeEditor block={block} dispatch={dispatch} />
    case 'order_steps':     return <OrderStepsEditor block={block} dispatch={dispatch} />
    case 'figure':          return <FigureEditor block={block} dispatch={dispatch} />
    case 'spacer':          return <SpacerEditor block={block} dispatch={dispatch} />
  }
}
