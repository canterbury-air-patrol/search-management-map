import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'
import { Button, Table } from 'react-bootstrap'

import React from 'react'

import $ from 'jquery'

class AssetDetailsPicker extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      assets: [],
      selectedAsset: null
    }
  }

  componentDidMount () {
    $.ajaxSetup({ timeout: 2500 })
    this.updateData()
    this.timer = setInterval(() => this.updateData(), 10000)
  }

  componentWillUnmount () {
    clearInterval(this.timer)
    this.timer = null
  }

  async updateData () {
    const self = this
    await $.get('/assets/mine/json/', function (data) {
      self.setState(function (oldState) {
        if (data.assets.length === 0) {
          return {
            assets: [],
            selectedAsset: null
          }
        }
        if (oldState.selectedAsset === null) {
          return {
            assets: data.assets,
            selectedAsset: data.assets[0].name
          }
        }
        return {
          assets: data.assets
        }
      })
    })
  }

  changeSelectedAsset (event) {
    const target = event.target
    const value = target.type === 'checkbox' ? target.checked : target.value
    this.setState({
      selectedAsset: value
    })
  }

  render () {
    if (!this.state.assets.length) {
      return (<></>)
    }
    const assetsOptions = this.state.assets.map(asset => (<option key={asset.id} id={asset.name}>{asset.name}</option>))

    return (
      <>
        <Table>
          <tbody>
            <tr>
              <td>View Asset:</td>
              <td><select onChange={this.changeSelectedAsset}>{assetsOptions}</select></td>
              <td><Button href={`/assets/${this.state.selectedAsset}/ui/`}>Interface</Button></td>
            </tr>
          </tbody>
        </Table>
      </>
    )
  }
}

export { AssetDetailsPicker }
