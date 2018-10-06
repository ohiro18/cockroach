import _ from "lodash";
import React from "react";
import Helmet from "react-helmet";
import { withRouter, WithRouterProps } from "react-router";
import { connect } from "react-redux";

import { enqueueRange } from "src/util/api";
import { cockroach } from "src/js/protos";
import Print from "src/views/reports/containers/range/print";

import EnqueueRangeRequest = cockroach.server.serverpb.EnqueueRangeRequest;
import EnqueueRangeResponse = cockroach.server.serverpb.EnqueueRangeResponse;

interface EnqueueRangeProps {
  handleEnqueueRange: (queue: string, rangeID: number, nodeID: number, skipShouldQueue: boolean) => Promise<EnqueueRangeResponse>;
}

interface EnqueueRangeState {
  queue: string;
  rangeID: string;
  nodeID: string;
  skipShouldQueue: boolean;
  response: EnqueueRangeResponse;
  error: Error;
}

class EnqueueRange extends React.Component<EnqueueRangeProps & WithRouterProps, EnqueueRangeState> {
  constructor(props: EnqueueRangeProps & WithRouterProps) {
    super(props);
    this.state = {
      queue: "",
      rangeID: "",
      nodeID: "",
      skipShouldQueue: false,
      response: null,
      error: null,
    };
  }

  handleUpdateQueue = (evt: React.FormEvent<{ value: string }>) => {
    this.setState({
      queue: evt.currentTarget.value,
    });
  }

  handleUpdateRangeID = (evt: React.FormEvent<{ value: string }>) => {
    this.setState({
      rangeID: evt.currentTarget.value,
    });
  }

  handleUpdateNodeID = (evt: React.FormEvent<{ value: string }>) => {
    this.setState({
      nodeID: evt.currentTarget.value,
    });
  }

  handleSubmit = (evt: React.FormEvent<any>) => {
    evt.preventDefault();

    this.props.handleEnqueueRange(
      this.state.queue,
      // These parseInts should succeed because <input type="number" />
      // enforces numeric input. Otherwise they're NaN.
      _.parseInt(this.state.rangeID),
      _.parseInt(this.state.nodeID),
      this.state.skipShouldQueue,
    ).then(
      (response) => {
        this.setState({ response: response, error: null });
      },
      (err) => {
        this.setState({ response: null, error: err });
      },
    );
  }

  renderResponse() {
    const { response } = this.state;

    if (!response) {
      return null;
    }

    return (
      <div>
        <h2>Enqueue Range Output</h2>
        {
          _.map(response.details, (details) => (
            <div>
              <h3>Node n{details.node_id}</h3>
              <table className="enqueue-range-table">
                <tbody>
                  <tr className="enqueue-range-table__row enqueue-range-table__row--header">
                    <th className="enqueue-range-table__cell enqueue-range-table__cell--header">Timestamp</th>
                    <th className="enqueue-range-table__cell enqueue-range-table__cell--header">Message</th>
                  </tr>
                  {
                    _.map(details.events, (event) => (
                      <tr className="enqueue-range-table__row">
                        <td className="enqueue-range-table__cell enqueue-range-table__cell--date">{Print.Timestamp(event.time)}</td>
                        <td className="enqueue-range-table__cell">{event.message}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            {details.error ? <div><b>Error:</b> {details.error}</div> : null}
            </div>
          ))
        }
      </div>
    );
  }

  renderError() {
    const { error } = this.state;

    if (!error) {
      return null;
    }

    return (
      <div>Error running EnqueueRange: { error.message }</div>
    );
  }

  render() {
    return (
      <div>
        <Helmet>
          <title>Enqueue Range</title>
        </Helmet>
        <div className="content">
          <section className="section">
            <div className="form-container">
              <h1 className="heading">Manually enqueue range in a replica queue</h1>
              <br />
              <form onSubmit={this.handleSubmit} className="form-internal" method="post">
                <input
                  type="text"
                  name="queue"
                  className="input-text"
                  onChange={this.handleUpdateQueue}
                  value={this.state.queue}
                  placeholder="Queue"
                />
                <br />
                <input
                  type="number"
                  name="rangeID"
                  className="input-text"
                  onChange={this.handleUpdateRangeID}
                  value={this.state.rangeID}
                  placeholder="RangeID"
                />
                <br />
                <input
                  type="number"
                  name="nodeID"
                  className="input-text"
                  onChange={this.handleUpdateNodeID}
                  value={this.state.nodeID}
                  placeholder="NodeID (optional)"
                />
                <br />
                <label>
                  <input
                    type="checkbox"
                    checked={this.state.skipShouldQueue}
                    name="skipShouldQueue"
                    onChange={() => this.setState({ skipShouldQueue: !this.state.skipShouldQueue })}
                  />
                  SkipShouldQueue
                </label>
                <br />
                <input
                  type="submit"
                  className="submit-button"
                  value="Submit"
                />
              </form>
            </div>
          </section>
        </div>
        <div>
          <section className="section">
            {this.renderResponse()}
            {this.renderError()}
          </section>
        </div>
      </div>
    );
  }
}

// tslint:disable-next-line:variable-name
const EnqueueRangeConnected = connect(
  () => {
    return {};
  },
  () => ({
    handleEnqueueRange: (queue: string, rangeID: number, nodeID: number, skipShouldQueue: boolean) => {
      const req = new EnqueueRangeRequest({
        queue: queue,
        range_id: rangeID,
        node_id: nodeID,
        skip_should_queue: skipShouldQueue,
      });
      return enqueueRange(req);
    },
  }),
)(withRouter(EnqueueRange));

export default EnqueueRangeConnected;
