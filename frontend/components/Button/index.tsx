const Button = (props:any) => {
    const { onClick, buttonText } = props;
    console.log(onClick);
    return (
        <button 
            
            onClick={onClick}
            type="button" 
            style={{
                    padding: '8px 12px'
            }}
        >
            {buttonText}
        </button>
    )
}

export default Button;