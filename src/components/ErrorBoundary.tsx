import { Component, type ErrorInfo, type ReactNode } from 'react'
import { NoticeBox } from '@dhis2/ui'
import i18n from '../i18n'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Outbreak Signal Manager crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <NoticeBox error title={i18n.t('Outbreak Signal Manager hit an unexpected error')}>
            {this.state.error.message}
          </NoticeBox>
        </div>
      )
    }
    return this.props.children
  }
}
