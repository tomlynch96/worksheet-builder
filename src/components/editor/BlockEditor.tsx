import type { Block, DataBlock, FigureBlock, OakContext, QuestionBlock } from '../../types/worksheet'
import type { DiagramVariable } from '../../types/diagram'
import type { GeneratedQuestion } from '../../utils/generateDiagram'
import { describeQuestion, questionUpdates } from './DiagramContext'
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
import { DataEditor } from './blocks/DataEditor'
import { NumericalAnswersEditor } from './blocks/NumericalAnswersEditor'

interface Props {
  block: Block
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
  oakContext?: OakContext
}

export function BlockEditor({ block, blocks, dispatch, oakContext }: Props) {
  switch (block.type) {
    case 'header':          return <HeaderEditor block={block} dispatch={dispatch} />
    case 'instructions':    return <InstructionsEditor block={block} dispatch={dispatch} />
    case 'question':        return <QuestionEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'multiple_choice': return <MultipleChoiceEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'worked_example':  return <WorkedExampleEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'information':     return <InformationEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'match_them_up':   return <MatchThemUpEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'cloze':           return <ClozeEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'order_steps':     return <OrderStepsEditor block={block} blocks={blocks} dispatch={dispatch} />
    case 'figure':             return <StandaloneFigureEditor block={block} blocks={blocks} dispatch={dispatch} oakImages={oakContext?.images} />
    case 'spacer':             return <SpacerEditor block={block} dispatch={dispatch} />
    case 'data':               return <DataEditor block={block as DataBlock} dispatch={dispatch} blocks={blocks} />
    case 'numerical_answers':  return <NumericalAnswersEditor block={block} dispatch={dispatch} />
  }
}

// A figure selected on its own: an AI-written question either refreshes the
// question it is already attached to, or is added straight after it.
function StandaloneFigureEditor({ block, blocks, dispatch, oakImages }: {
  block: FigureBlock
  blocks: Block[]
  dispatch: React.Dispatch<WorksheetAction>
  oakImages?: string[]
}) {
  const owner = blocks.find((b): b is QuestionBlock => b.type === 'question' && b.attachedFigureId === block.id)

  function applyQuestion(q: GeneratedQuestion, vars: DiagramVariable[]) {
    const updates = questionUpdates(q, vars)
    if (owner) {
      dispatch({ type: 'UPDATE_BLOCK', id: owner.id, updates })
    } else {
      const question: QuestionBlock = {
        id: crypto.randomUUID(), type: 'question', stem: '', marks: 0, lines: 0, parts: [],
        ...updates, attachedFigureId: block.id,
      }
      dispatch({ type: 'ADD_BLOCK', block: question, afterId: block.id })
    }
  }

  return (
    <FigureEditor
      block={block}
      dispatch={dispatch}
      oakImages={oakImages}
      questionContext={owner ? describeQuestion(owner) : undefined}
      onQuestionGenerated={applyQuestion}
    />
  )
}
