
import React from 'react'; 
import PropTypes from 'prop-types';

import { Navbar, Nav, NavItem } from 'react-bootstrap';
import './toolBar.css';

import ReactDataGrid from 'react-data-grid';
import './react_data_grid.css'; 

const TableToolBar = ({ data, setCurrentTab, setMessage, catalogosEditar }) => {

    const pagingText = `(${data.length} registros)`;

    const handleSelect = (selectedKey) => {
        switch (selectedKey) {
            case 1:
                setMessage({ type: 'info', message: '', show: false });
                setCurrentTab(3);
                break;
        }
    }

    return (
        <>
            <Navbar collapseOnSelect fluid className="toolBar">
                <Navbar.Collapse>
                    {
                        catalogosEditar && 
                    
                        <Nav onSelect={handleSelect}>
                            <NavItem eventKey={1} className="navBar_button">
                                Nuevo
                            </NavItem>
                        </Nav>
                    }

                    <Nav pullRight>
                        <Navbar.Text>
                            {pagingText}&nbsp;&nbsp;
                        </Navbar.Text>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </>
    )
}

TableToolBar.propTypes = {
    data: PropTypes.array.isRequired, 
    setCurrentTab: PropTypes.func.isRequired, 
    setMessage: PropTypes.func.isRequired, 
    catalogosEditar: PropTypes.bool.isRequired
};

const reactDataGridDocStateFormatter = ({ value }) => {
    switch (value) {
        case 0: return (<span style={{ color: 'gray', fontSize: '10px' }} className="fa fa-circle-thin" />);
        case 1: return (<span style={{ color: 'blue', fontSize: '10px' }} className="fa fa-asterisk" />);
        case 2: return (<span style={{ color: 'brown', fontSize: '10px' }} className="fa fa-pencil" />);
        case 3: return (<span style={{ color: 'red', fontSize: '10px' }} className="fa fa-trash" />);
        default: return '';
    }
};

const columns = [
    { key: 'docState', name: '', resizable: false, formatter: reactDataGridDocStateFormatter, sortable: false, width: 30, cellClass: 'text-center' },
    { key: 'titulo', name: 'Título', resizable: true, sortable: true, sortDescendingFirst: false, width: 60, cellClass: 'text-center' },
    { key: 'nombre', name: 'Nombre', resizable: true, sortable: true, sortDescendingFirst: false, width: 200 },
    { key: 'cargo', name: 'Cargo', resizable: true, sortable: true, sortDescendingFirst: false, width: 140 },
    { key: 'departamento', name: 'Departamento', resizable: true, sortable: true, sortDescendingFirst: false, width: 140 },
    { key: 'email', name: 'Email', sortable: true, sortDescendingFirst: false, resizable: true, width: 260 }
];

const Lista = ({ items, setCurrentTab, setClickedRow, setMessage, catalogosEditar }) => {

    const handleRowClick = (index) => {
        // mostramos el item en el tab 2
        // const clickedItem = items[index];        // en este caso pasamos el idx, en vez del item 
        setClickedRow(index);
        setMessage({ type: 'info', message: '', show: false });
        setCurrentTab(2);
    }

    return (
        <>
            <TableToolBar data={items} 
                          setCurrentTab={setCurrentTab} 
                          setMessage={setMessage} 
                          catalogosEditar={catalogosEditar} />

            <div className="div-react-data-grid">
                <ReactDataGrid
                    columns={columns}
                    rowGetter={i => items[i]}
                    rowsCount={items.length}
                    minHeight={300}
                    onRowClick={handleRowClick}
                />
            </div>
        </>
    )
}

Lista.propTypes = {
    items: PropTypes.array.isRequired, 
    setCurrentTab: PropTypes.func.isRequired,
    setClickedRow: PropTypes.func.isRequired, 
    setMessage: PropTypes.func.isRequired, 
    catalogosEditar: PropTypes.bool.isRequired
};

export default Lista; 