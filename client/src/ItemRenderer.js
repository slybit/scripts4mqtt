import React from 'react';

const Folder = ({ name, collapsed, index, onToggleCollapse }) => {
  const handleClick = () => {
    onToggleCollapse(index);
  };
  return (
    <div className='draggable folder'>
      <button className='toggleCollapseHandle' onClick={handleClick}>
        F
      </button>
      {name}
    </div>
  );
};

const File = ({ name, collapsed }) => {
    let classes = ['draggable', 'file'];
    if (collapsed) classes.push('collapsed');
    return (
        <div className={classes}>
            f: {name}
        </div>
    )
};

const ItemRenderer = (props) => {
  const { connectDragSource, connectDragPreview, connectDropTarget, isDragging, isClosestDragging, type } = props;
  let classes = isDragging || isClosestDragging ? 'mute' : '';
  return connectDragSource(connectDragPreview(connectDropTarget(
    <div className={classes} style={{ paddingLeft: path.length * 20 }}>
      {type === 'or' && <Folder {...props} />}
      {type === 'and' && <Folder {...props} />}
      {type === 'simple' && <File {...props} />}
      {type === 'mqtt' && <File {...props} />}
    </div>,
  )));
};


export default ItemRenderer;