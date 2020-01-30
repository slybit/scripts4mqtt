import React from "react";
import Icon from '@mdi/react'
import { mdiDelete, mdiCheckboxBlankOutline, mdiCheckBoxOutline } from '@mdi/js'

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};

const selectedStyle = {
    color: 'blue',
    background: 'ALICEBLUE'
};

export class RuleList extends React.Component {

    handleDeleteClick = (e, key) => {
        e.stopPropagation();
        this.props.onDeleteClick(key);
    }

    handleEnableClick = (e, index, newEnabledState) => {
        e.stopPropagation();
        this.props.onEnableClick(index, newEnabledState);
    }



    render() {

        const items = this.props.data.map((rule, index) => {

            const style = {
                cursor: 'pointer',
                ...(rule.key === this.props.selectedRule ? selectedStyle: null)
            }

            return (

                <li className="list-group-item" key={rule.key} id={rule.key} style={style} onClick={() => this.props.onClick(rule.key)}>
                <Icon path={rule.enabled ? mdiCheckBoxOutline : mdiCheckboxBlankOutline} className="editIcon" size={1} onClick={(e) => this.handleEnableClick(e, rule.key, !rule.enabled)}/>
                {' '}{rule.name}
                <span style={pushRightStyle}>
                    <Icon path={mdiDelete} size={1} className="deleteIcon" onClick={(e) => this.handleDeleteClick(e, rule.key)}/>
                </span>
                </li>
            )
        });
        return (
            <ul className="list-group">
                {items}
            </ul>
        );
    }
}
