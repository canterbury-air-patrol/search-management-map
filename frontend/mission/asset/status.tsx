import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Table, Button } from 'react-bootstrap'

import React from 'react'
import * as ReactDOM from 'react-dom/client'

import { smmGetJSON, smmPost } from '../../ajax'
import { SMMTopBar } from '../../menu/topbar'

interface MissionAssetStatusValue {
  id: number
  name: string
}

interface MissionAssetStatusData {
  status: string
  status_description: string
  notes: string
  since: string
}

interface MissionAssetStatusFormProps {
  asset: number
  mission: number
}

interface MissionAssetStatusFormState {
  statusValues: MissionAssetStatusValue[]
  selectedValueId?: number
  notes?: string
}

class MissionAssetStatusForm extends React.Component<MissionAssetStatusFormProps, MissionAssetStatusFormState> {
  timer?: number

  constructor(props: MissionAssetStatusFormProps) {
    super(props)

    this.state = {
      statusValues: [],
      selectedValueId: undefined,
      notes: ''
    }

    this.updateStatusValuesResponse = this.updateStatusValuesResponse.bind(this)
    this.updateSelectedStateValue = this.updateSelectedStateValue.bind(this)
    this.updateNotes = this.updateNotes.bind(this)
    this.resetForm = this.resetForm.bind(this)
    this.setStatus = this.setStatus.bind(this)
  }

  componentDidMount() {
    this.updateStatusValues()
    this.timer = setInterval(() => this.updateStatusValues(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateStatusValuesResponse(data: { values: MissionAssetStatusValue[] }) {
    this.setState(function (oldState) {
      const newState: MissionAssetStatusFormState = {
        statusValues: data.values
      }
      if (oldState.selectedValueId === null && data.values.length > 0) {
        newState.selectedValueId = data.values[0].id
      }
      return newState
    })
  }

  async updateStatusValues() {
    await smmGetJSON('/mission/asset/status/values/', {}, this.updateStatusValuesResponse)
  }

  updateSelectedStateValue(event: React.ChangeEvent<HTMLSelectElement>) {
    const { target } = event
    const { value } = target

    this.setState({ selectedValueId: Number(value) })
  }

  updateNotes(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const { target } = event
    const { value } = target

    this.setState({ notes: value })
  }

  resetForm() {
    this.setState({
      selectedValueId: undefined,
      notes: ''
    })
  }

  setStatus() {
    smmPost(
      `/mission/${this.props.mission}/assets/${this.props.asset}/status/`,
      {
        value_id: this.state.selectedValueId,
        notes: this.state.notes
      },
      this.resetForm
    )
  }

  render() {
    const statusValues = this.state.statusValues.map((v) => (
      <option key={v.id} value={v.id}>
        {v.name}
      </option>
    ))
    return (
      <tr>
        <td>
          <select onChange={this.updateSelectedStateValue} defaultValue={this.state.selectedValueId}>
            {statusValues}
          </select>
        </td>
        <td></td>
        <td>
          <textarea onChange={this.updateNotes} value={this.state.notes}></textarea>
        </td>
        <td>
          <Button onClick={this.setStatus}>Set Status</Button>
        </td>
      </tr>
    )
  }
}

interface MissionAssetStatusProps {
  asset: number
  mission: number
}

interface MissionAssetStatusState {
  statusData?: MissionAssetStatusData
}

class MissionAssetStatus extends React.Component<MissionAssetStatusFormProps, MissionAssetStatusState> {
  timer?: number

  constructor(props: MissionAssetStatusProps) {
    super(props)

    this.state = {
      statusData: undefined
    }
    this.updateDataResponse = this.updateDataResponse.bind(this)
  }

  componentDidMount() {
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = undefined
  }

  updateDataResponse(data: { status: MissionAssetStatusData }) {
    this.setState(function () {
      return {
        statusData: data.status
      }
    })
  }

  async updateData() {
    await smmGetJSON(`/mission/${this.props.mission}/assets/${this.props.asset}/status/`, {}, this.updateDataResponse)
  }

  render() {
    return (
      <div>
        <Table>
          <thead>
            <tr>
              <td>Mission Status</td>
              <td>Description</td>
              <td>Notes</td>
              <td>Since</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{this.state.statusData?.status}</td>
              <td>{this.state.statusData?.status_description}</td>
              <td>{this.state.statusData?.notes}</td>
              <td>{this.state.statusData?.since === undefined ? '' : new Date(this.state.statusData.since).toLocaleString()}</td>
            </tr>
            <MissionAssetStatusForm asset={this.props.asset} mission={this.props.mission} />
          </tbody>
        </Table>
      </div>
    )
  }
}

function createMissionAssetStatus(elementId: string, asset: number, mission: number) {
  const div = ReactDOM.createRoot(document.getElementById(elementId)!)

  div.render(
    <>
      <SMMTopBar />
      <MissionAssetStatus asset={asset} mission={mission} />
    </>
  )
}

export { MissionAssetStatus }

// @ts-expect-error: globalThis doesn't have a define
globalThis.createMissionAssetStatus = createMissionAssetStatus
