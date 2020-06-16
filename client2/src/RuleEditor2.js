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
        for (let index = 0; index < items.length; index += 1) {
            if (!(items[index].type === 'or' || items[index].type === 'and') && findDescendants(items, index).length > 0) 
                return;
        }
        setData({ ...data, flatConditions: items });
    }


    const handleEditableItemClick = () => {
        console.log('boom');
    }

   

 
    return (
        <RightColumn>

            <AppColumn10>


                {data.flatConditions.length > 0 && <Sortly
                    items={data.flatConditions}
                    onChange={handleChange} >
                    {(props) => <ConditionItemRenderer {...props} onEditableItemClick={handleEditableItemClick} />}
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



const ConditionItemRenderer = (props) => {

    const { data, onEditableItemClick } = props;
    const [, drag] = useDrag();
    const [, drop] = useDrop({
        drop() {console.log('drop')}

    });


    const handleClick = () => {
        onEditableItemClick("conditions", data.index, "flatConditions", staticData.editor.condition[data.type]);
    };

    let label = "";
    let isNew = false;
    switch (data.type) {
        case "and":
            label = "AND"
            break;
        case "or":
            label = "OR";
            break;
        case "mqtt":
            isNew = isNewItem(data, "condition", data.type);
            const { topic } = data;
            label = `MQTT [${topic}]`;
            break;
        case "alias":
            isNew = isNewItem(data, "condition", data.type);
            const { alias } = data;
            label = `ALIAS [${alias}]`;
            break;
        case "cron":
            isNew = isNewItem(data, "condition", data.type);
        default:
            label = staticData.conditions[data.type];
            break;
    }

    if (isNew) {
        label = "* " + label;
    }

    const style = {
        ...itemStyle,
        ...(isNew ? newStyle : null),
        marginLeft: data.depth * 30,
    };

    return (
        <div ref={drop}>
            <div ref={drag} style={style}>{label}
                <span style={pushRightStyle}>
                    <Icon path={mdiPencilOutline} size={1} className="editIcon" onClick={handleClick} />
                </span>
            </div>
        </div>
    );

}




