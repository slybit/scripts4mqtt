import React from "react";
import Icon from '@mdi/react'
import { mdiDelete } from '@mdi/js'

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};

const selectedStyle = {
    color: 'blue'
};

export class AliasList extends React.Component {

    handleDeleteClick = (e, aliasId) => {
        e.stopPropagation();
        this.props.onDeleteClick(aliasId);
    }

    handleEnableClick = (e, index) => {
        e.stopPropagation();
        this.props.onEnableClick(index);
    }



    render() {

        const items = this.props.data.map((alias, index) => {
            const style = {
                cursor: 'pointer',
                ...(alias === this.props.selectedAlias ? selectedStyle: null)
            }
            return (

                <li className="list-group-item" key={alias} id={alias} style={style} onClick={() => this.props.onClick(alias)}>
                {alias}
                <span style={pushRightStyle}>
                    <Icon path={mdiDelete} size={1} className="deleteIcon" onClick={(e) => this.handleDeleteClick(e, alias)}/>
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
