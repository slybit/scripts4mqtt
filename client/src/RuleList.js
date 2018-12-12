import React from "react";

export class RuleList extends React.Component {
    onItemSelection = arg => {
        //this.setState({ selectedPath: arg.path });
    };

    render() {
        const items = this.props.data.map(rule => (
            <p key={rule.key} id={rule.key} onClick={() => this.props.onClick(rule.key)}>{rule.name}</p>
        ));
        return (
            <div>
                {items}
            </div>
        );
    }
}
