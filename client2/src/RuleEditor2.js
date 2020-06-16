import React, { useState, useEffect } from "react";

import Sortly, { useDrag, useDrop, remove, findDescendants } from 'react-sortly';
import { HorizontalContainer, AppColumn10, RightColumn, AppEditor, Header } from "./containers";
import { Button, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem, InputGroup, InputGroupAddon, Input, FormGroup, Label } from 'reactstrap';
import Icon from '@mdi/react'
import { mdiPencilOutline, mdiCancel, mdiCheck } from '@mdi/js'
import update from 'immutability-helper';
//import ReactJson from 'react-json-view';
//import format from 'string-format';
import { addIds, stripIds, flattenConditions, buildTree, staticData, isNewItem } from './utils';
//import { DynamicEditor } from './DynamicEditor'
import axios from 'axios';


const ItemRenderer = (props) => {
    const { data: { type, depth } } = props;
    const [, drag] = useDrag();
    const [, drop] = useDrop();

    return (
      <div ref={drop}>
        <div ref={drag} style={{ marginLeft: depth * 20 }}>{type}</div>
      </div>
    );
  };

export const RuleEditor = (props) => {

    /*
        data = {
            ruleId: undefined,
            name: "",
            ontrue: [],
            onfalse: [],
            flatConditions: [],
            editorVisible: false
        };
    */

    const [data, setData] = useState({
        ruleId: undefined,
        name: "",
        ontrue: [],
        onfalse: [],
        flatConditions: [],
        editorVisible: false
    });

    useEffect(() => {
        async function fetchData() {
            const response = await axios.get('/api/rule/' + props.id);
            console.log(response.data);
            setData({ ...data, flatConditions: addIds(flattenConditions(response.data.condition)) });
        };
        fetchData();
    }, [props]);


    const handleChange = (items) => {
        setData({ ...data, flatConditions: items });
    }

    const handleMove = (items, index, newIndex) => {
        if (this.state.editorVisible) return false;
        const { path } = items[newIndex];
        const parent = items.find(item => item.id === path[path.length - 1]);
        // parent must be OR or AND or root (so "no parent")
        if (!parent || (parent.type === 'or' || parent.type === 'and')) {
            return true;
        } else {
            return false;
        }
    }




    return (
        <RightColumn>

            <AppColumn10>


                { data.flatConditions.length > 0 && <Sortly
                    items={data.flatConditions}
                    onChange={handleChange}
                    onMove={handleMove}>
                        {(props) => <ItemRenderer {...props} />}
                    </Sortly>
                }




            </AppColumn10>
            <AppColumn10>
                {<pre className='code'>{JSON.stringify(data, undefined, 4)}</pre>}
            </AppColumn10>



        </RightColumn>
    );

}

/* --------------------------------------------------------------------------------------------------------------------
  Styles
-------------------------------------------------------------------------------------------------------------------- */


const itemStyle = {
    border: '1px solid #ccc',
    cursor: 'move',
    padding: 10,
    marginBottom: 4,
};

const muteStyle = {
    opacity: .3,
}

const newStyle = {
    background: '#e8ffbc',
    color: 'green',
    fontWeight: 600,
}

const pushRightStyle = {
    float: 'right',
    cursor: 'pointer'
};



/* --------------------------------------------------------------------------------------------------------------------
  Condition and Action item renderers
-------------------------------------------------------------------------------------------------------------------- */



class ConditionItemRendererClass extends React.Component {

    handleClick = () => {
        this.props.onEditableItemClick("conditions", this.props.index, "flatConditions", staticData.editor.condition[this.props.type]);
    }

    handleDeleteClick = (e) => {
        e.stopPropagation();
        // TODO: generic delete
        this.props.handleConditionDeleteClick(this.props.id);
    }

    render() {
        const {
            type, path, connectDragSource, connectDropTarget,
            isDragging, isClosestDragging
        } = this.props;

        let label = "";
        let isNew = false;
        switch (type) {
            case "and":
                label = "AND"
                break;
            case "or":
                label = "OR";
                break;
            case "mqtt":
                isNew = isNewItem(this.props, "condition", type);
                const { topic } = this.props;
                label = `MQTT [${topic}]`;
                break;
            case "alias":
                isNew = isNewItem(this.props, "condition", type);
                const { alias } = this.props;
                label = `ALIAS [${alias}]`;
                break;
            case "cron":
                isNew = isNewItem(this.props, "condition", type);
            default:
                label = staticData.conditions[type];
                break;
        }
        if (isNew) {
            label = "* " + label;
        }

        const style = {
            ...itemStyle,
            ...(isDragging || isClosestDragging ? muteStyle : null),
            ...(isNew ? newStyle : null),
            marginLeft: path.length * 30,
        };

        const el = <div style={style}>
            {label}
            <span style={pushRightStyle}>
                <Icon path={mdiPencilOutline} size={1} className="editIcon" onClick={this.handleClick} />
            </span></div>;
        return connectDragSource(connectDropTarget(el));
    }

}




