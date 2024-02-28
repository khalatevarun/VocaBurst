const Input = (props:any) => {
    const { onInputChange, value } = props;
    return (
        <input 
            type="text"
            style={{ padding: '8px 12px' }}
            onChange={onInputChange}
            value={value}
        />
    )
}

export default Input;